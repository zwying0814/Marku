package comment

import (
	"fmt"
	"marku-server/model"
	"marku-server/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// SubmitCommentRequest 提交评论请求结构
type SubmitCommentRequest struct {
	SiteID   string `json:"siteId" binding:"required"`
	Mark     string `json:"mark" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Parent   string `json:"parent,omitempty"`
	URL      string `json:"url,omitempty"`
	IP       string `json:"ip,omitempty"`
	UA       string `json:"ua,omitempty"`
	Location string `json:"location,omitempty"`
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

	// 创建游客用户
	user, err := model.CreateGuestUser(
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

	// 处理父评论ID
	parentID := 0
	if req.Parent != "" && req.Parent != "0" {
		// 这里可以添加父评论ID的验证逻辑
		
		// 暂时设置为0，表示顶级评论
		parentID = 0
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
		Status:   0, // 默认待审核
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