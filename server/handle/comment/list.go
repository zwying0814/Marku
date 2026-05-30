package comment

import (
	"math"
	"marku-server/config"
	"marku-server/model"
	"marku-server/utils"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type UserResponse struct {
	ID       uint    `json:"id"`
	Username string  `json:"username"`
	Email    *string `json:"email,omitempty"`
	URL      *string `json:"url,omitempty"`
	Avatar   *string `json:"avatar,omitempty"`
}

type CommentResponse struct {
	ID        uint    `json:"id"`
	SiteID    string  `json:"site_id"`
	Mark      string  `json:"mark"`
	Featured  bool    `json:"featured"`
	Content   string  `json:"content"`
	IP        *string `json:"ip,omitempty"`
	Location  *string `json:"location,omitempty"`
	UA        *string `json:"ua,omitempty"`
	Parent    int     `json:"parent"`
	Status    int     `json:"status"`
	Up        int     `json:"up"`
	Down      int     `json:"down"`
	UserID    string  `json:"user_id,omitempty"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
	// 用户信息
	User     *UserResponse `json:"user,omitempty"`
	Username string  `json:"username"`
	Email    *string `json:"email,omitempty"`
	URL      *string `json:"url,omitempty"`
	Avatar   *string `json:"avatar,omitempty"`
}

// GetComments 获取评论列表
func GetComments(c *gin.Context) {
	siteId := c.Query("siteId")
	key := c.Query("key")

	if siteId == "" || key == "" {
		utils.SendError(c, http.StatusBadRequest, "siteId 和 key 参数必需")
		return
	}

	page := parsePositiveInt(c.Query("page"), 1)
	pageSize := parsePositiveInt(c.Query("pageSize"), 10)
	if pageSize > 100 {
		pageSize = 100
	}

	// 支持可选查询参数 includePending=1 用于包含未审核评论（便于测试）
	includePending := c.Query("includePending") == "1"
	db := model.DB.Where("site_id = ? AND mark = ?", siteId, key)
	if !includePending {
		db = db.Where("status = ?", config.GetApprovedCommentStatusValue())
	}

	var total int64
	if err := db.Model(&model.Comment{}).Count(&total).Error; err != nil {
		utils.SendError(c, http.StatusInternalServerError, "统计评论数量失败: "+err.Error())
		return
	}

	var comments []model.Comment
	offset := (page - 1) * pageSize
	if err := db.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&comments).Error; err != nil {
		utils.SendError(c, http.StatusInternalServerError, "查询评论失败: "+err.Error())
		return
	}

	userIDs := make([]uint, 0, len(comments))
	userIDSet := make(map[uint]struct{}, len(comments))
	for _, comment := range comments {
		userID, err := strconv.ParseUint(comment.UserID, 10, 64)
		if err != nil {
			continue
		}
		uid := uint(userID)
		if _, exists := userIDSet[uid]; exists {
			continue
		}
		userIDSet[uid] = struct{}{}
		userIDs = append(userIDs, uid)
	}

	usersByID := make(map[string]model.User, len(userIDs))
	if len(userIDs) > 0 {
		var users []model.User
		if err := model.DB.Where("id IN ?", userIDs).Find(&users).Error; err == nil {
			for _, user := range users {
				usersByID[strconv.FormatUint(uint64(user.ID), 10)] = user
			}
		}
	}

	// 构建响应数据，包含用户信息
	responses := make([]CommentResponse, 0)
	for _, comment := range comments {
		// 优先使用评论快照字段；登录用户则用 users 表补缺
		var userInfo *UserResponse
		username := strings.TrimSpace(comment.Username)
		email := comment.Email
		url := comment.URL
		avatar := comment.Avatar
		if user, ok := usersByID[comment.UserID]; ok {
			if username == "" {
				username = user.Username
			}
			if email == nil {
				email = user.Email
			}
			if url == nil {
				url = user.URL
			}
			if avatar == nil {
				avatar = user.Avatar
			}
			userInfo = &UserResponse{
				ID:       user.ID,
				Username: user.Username,
				Email:    user.Email,
				URL:      user.URL,
				Avatar:   user.Avatar,
			}
		}
		if username == "" {
			username = "匿名用户"
		}

		responses = append(responses, CommentResponse{
			ID:        comment.ID,
			SiteID:    comment.SiteID,
			Mark:      comment.Mark,
			Featured:  comment.Featured,
			Content:   comment.Content,
			IP:        comment.IP,
			Location:  comment.Location,
			UA:        comment.UA,
			Parent:    comment.Parent,
			Status:    comment.Status,
			Up:        comment.Up,
			Down:      comment.Down,
			UserID:    comment.UserID,
			CreatedAt: comment.CreatedAt.String(),
			UpdatedAt: comment.UpdatedAt.String(),
			User:      userInfo,
			Username:  username,
			Email:     email,
			URL:       url,
			Avatar:    avatar,
		})
	}

	pageCount := 0
	if pageSize > 0 {
		pageCount = int(math.Ceil(float64(total) / float64(pageSize)))
	}

	utils.SendResponse(c, http.StatusOK, "获取评论成功", gin.H{
		"data":      responses,
		"total":     total,
		"page":      page,
		"pageSize":  pageSize,
		"pageCount": pageCount,
	})
}

func parsePositiveInt(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
