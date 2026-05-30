package model

import (
	"marku-server/types"
)

// Comment 评论数据模型
type Comment struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	SiteID   string `gorm:"not null;index:idx_comment_site" json:"site_id"`
	Mark     string `gorm:"not null;index:idx_comment_mark" json:"mark"`
	Featured bool   `gorm:"default:false" json:"featured"`          // 是否精选
	Content  string `gorm:"type:text;not null" json:"content"`      // 评论内容
	IP       *string `gorm:"size:45" json:"ip,omitempty"`           // IP地址，支持IPv6
	Location *string `gorm:"size:100" json:"location,omitempty"`    // 地区信息
	UA       *string `gorm:"size:500" json:"ua,omitempty"`          // User Agent
	Parent   int    `gorm:"default:0;index" json:"parent"`          // 父评论ID，0表示顶级评论
	Status   int    `gorm:"default:0;index" json:"status"`          // 状态：0-待审核，1-已通过，-1-已拒绝
	Up       int    `gorm:"default:0" json:"up"`                    // 点赞数
	Down     int    `gorm:"default:0" json:"down"`                  // 点踩数
	UserID   string `gorm:"size:100" json:"user_id,omitempty"`     // 用户ID，登录用户关联 users 表
	Username string `gorm:"size:100" json:"username,omitempty"`    // 评论作者快照：昵称
	Email    *string `gorm:"size:255" json:"email,omitempty"`       // 评论作者快照：邮箱
	URL      *string `gorm:"size:500" json:"url,omitempty"`        // 评论作者快照：网址
	Avatar   *string `gorm:"size:500" json:"avatar,omitempty"`      // 评论作者快照：头像
	types.BaseModel
}