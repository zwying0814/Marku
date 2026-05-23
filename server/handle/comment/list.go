package comment

import (
	"marku-server/config"
	"marku-server/model"
	"marku-server/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

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
	Username string  `json:"username"`
	Email    *string `json:"email,omitempty"`
	URL      *string `json:"url,omitempty"`
}

// GetComments 获取评论列表
func GetComments(c *gin.Context) {
	siteId := c.Query("siteId")
	key := c.Query("key")

	if siteId == "" || key == "" {
		utils.SendError(c, http.StatusBadRequest, "siteId 和 key 参数必需")
		return
	}

	var comments []model.Comment
	// 支持可选查询参数 includePending=1 用于包含未审核评论（便于测试）
	includePending := c.Query("includePending") == "1"
	db := model.DB.Where("site_id = ? AND mark = ?", siteId, key)
	if !includePending {
		db = db.Where("status = ?", config.GetApprovedCommentStatusValue())
	}
	if err := db.Order("created_at DESC").Find(&comments).Error; err != nil {
		utils.SendError(c, http.StatusInternalServerError, "查询评论失败: "+err.Error())
		return
	}

	// 构建响应数据，包含用户信息
	responses := make([]CommentResponse, 0)
	for _, comment := range comments {
		// 查询关联的用户信息（若查询失败则仍返回评论，但用户名/email 为空）
		var user model.User
		username := ""
		var email *string = nil
		var url *string = nil
		if err := model.DB.Where("id = ?", comment.UserID).First(&user).Error; err == nil {
			username = user.Username
			email = user.Email
			url = user.URL
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
			Username:  username,
			Email:     email,
			URL:       url,
		})
	}

	utils.SendResponse(c, http.StatusOK, "获取评论成功", responses)
}
