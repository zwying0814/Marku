package comment

import (
	"encoding/json"
	"fmt"
	"marku-server/config"
	"marku-server/model"
	"marku-server/utils"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// SubmitCommentRequest 提交评论请求结构
type SubmitCommentRequest struct {
	SiteID   string `json:"siteId" binding:"required"`
	Mark     string `json:"mark" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Username string `json:"username,omitempty"`
	Email    string `json:"email,omitempty"`
	Token    string `json:"token,omitempty"`
	Parent   FlexibleInt `json:"parent,omitempty"`
	URL      string `json:"url,omitempty"`
	IP       string `json:"ip,omitempty"`
	UA       string `json:"ua,omitempty"`
	Location string `json:"location,omitempty"`
}

// FlexibleInt 兼容字符串和数字的整数类型
type FlexibleInt int

func (f *FlexibleInt) UnmarshalJSON(data []byte) error {
	if string(data) == "null" || len(data) == 0 {
		*f = 0
		return nil
	}

	if data[0] == '"' {
		var value string
		if err := json.Unmarshal(data, &value); err != nil {
			return err
		}
		value = strings.TrimSpace(value)
		if value == "" {
			*f = 0
			return nil
		}
		parsed, err := strconv.Atoi(value)
		if err != nil {
			return err
		}
		*f = FlexibleInt(parsed)
		return nil
	}

	var value int
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	*f = FlexibleInt(value)
	return nil
}

// SubmitComment 提交评论
func SubmitComment(c *gin.Context) {
	var req SubmitCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	// 内容验证
	if strings.TrimSpace(req.Content) == "" {
		utils.SendError(c, http.StatusBadRequest, "评论内容不能为空")
		return
	}

	var user *model.User
	authToken := strings.TrimSpace(req.Token)
	if authToken == "" {
		authToken = utils.ExtractBearerToken(c.GetHeader("Authorization"))
	}

	if authToken != "" {
		userID, err := utils.ParseAuthToken(authToken)
		if err != nil {
			utils.SendError(c, http.StatusUnauthorized, "登录状态无效: "+err.Error())
			return
		}
		user, err = model.GetUserByID(userID)
		if err != nil {
			utils.SendError(c, http.StatusUnauthorized, "登录状态无效: "+err.Error())
			return
		}
	} else {
		if config.IsCommentLoginRequired() {
			utils.SendError(c, http.StatusUnauthorized, "当前评论功能需要登录后使用")
			return
		}

		// 创建游客用户
		var err error
		user, err = model.CreateGuestUser(
			req.Username,
			req.Email,
			req.URL,
			req.IP,
			req.UA,
			req.Location,
		)
		if err != nil {
			utils.SendError(c, http.StatusInternalServerError, "创建用户失败: "+err.Error())
			return
		}
	}

	// 处理父评论ID
	parentID := 0
	if req.Parent != 0 {
		parentID = int(req.Parent)
		if parentID < 0 {
			utils.SendError(c, http.StatusBadRequest, "父评论ID无效")
			return
		}
	}

	// 创建评论
	comment := model.Comment{
		SiteID:   req.SiteID,
		Mark:     req.Mark,
		Content:  req.Content,
		Parent:   parentID,
		UserID:   fmt.Sprintf("%d", user.ID), // 关联用户ID
		IP:       &req.IP,
		UA:       &req.UA,
		Location: &req.Location,
		Status:   config.GetDefaultCommentStatusValue(),
		Featured: false,
		Up:       0,
		Down:     0,
	}

	// 保存到数据库
	if err := model.DB.Create(&comment).Error; err != nil {
		utils.SendError(c, http.StatusInternalServerError, "保存评论失败: "+err.Error())
		return
	}

	// 返回成功
	utils.SendResponse(c, http.StatusOK, "评论提交成功", map[string]interface{}{
		"id": comment.ID,
	})
}