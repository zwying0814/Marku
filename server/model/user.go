package model

import (
	"fmt"
	"time"
	"marku-server/types"
)

// User 模型定义
type User struct {
	Username string  `gorm:"size:100;not null" json:"username"`
	Password *string `gorm:"" json:"-"`                    // 游客用户可以没有密码
	Email    *string `gorm:"size:255" json:"email"`        // 游客用户可以没有邮箱
	Exp      int     `gorm:"default:0" json:"exp"`
	Role     int     `gorm:"default:1" json:"role"`        // 1: 游客, 2: 注册用户, 3: 管理员
	URL      *string `gorm:"size:500" json:"url"`          // 使用指针类型表示可选字段
	Avatar   *string `gorm:"size:500" json:"avatar"`       // 使用指针类型表示可选字段
	IP       *string `gorm:"size:45" json:"ip"`            // 使用指针类型表示可选字段
	UA       *string `gorm:"size:1000" json:"ua"`          // 使用指针类型表示可选字段
	Location *string `gorm:"size:100" json:"location"`       // 地区信息
	types.BaseModel
}

// GetUserByID 通过用户id找到用户信息
func GetUserByID(id uint) (*User, error) {
	var user User
	err := DB.Limit(1).Where("id = ?", id).Find(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByName 通过用户Name找到用户信息
func GetUserByName(name string) (*User, error) {
	var user User
	err := DB.Limit(1).Where("name = ?", name).Find(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail 通过用户email找到用户信息
func GetUserByEmail(email string) (*User, error) {
	var user User
	err := DB.Limit(1).Where("email = ?", email).Find(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByEmailOrName(emailOrName string) (*User, error) {
	var user User
	err := DB.Where("email = ? OR username = ?", emailOrName, emailOrName).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateGuestUser 创建游客用户
func CreateGuestUser(username, email, url, ip, ua, location string) (*User, error) {
	user := &User{
		Username: generateGuestUsername(),
		Role:     1, // 游客角色
	}

	// 设置可选字段
	if username != "" {
		user.Username = username
	}
	if email != "" {
		user.Email = &email
	}
	if url != "" {
		user.URL = &url
	}
	if ip != "" {
		user.IP = &ip
	}
	if ua != "" {
		user.UA = &ua
	}
	if location != "" {
		user.Location = &location
	}


	err := DB.Create(user).Error
	if err != nil {
		return nil, err
	}

	return user, nil
}

// CreateUser 创建注册用户
func CreateUser(username, password, email string) (*User, error) {
	user := &User{
		Username: username,
		Password: &password,
		Email:    &email,
		Role:     2, // 注册用户角色
	}

	err := DB.Create(user).Error
	if err != nil {
		return nil, err
	}

	return user, nil
}

// generateGuestUsername 生成游客用户名
func generateGuestUsername() string {
	// 使用时间戳生成唯一的游客用户名
	return "guest_" + fmt.Sprintf("%d", time.Now().UnixNano())
}
