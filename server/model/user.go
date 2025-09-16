package model

import (
	"marku-server/types"
)

// User 模型定义
type User struct {
	Username string  `gorm:"not null;unique" json:"username"`
	Password string  `gorm:"not null" json:"-"`
	Email    string  `gorm:"not null;unique" json:"email"`
	Exp      int     `gorm:"default:0" json:"exp"`
	Role     int     `gorm:"default:1" json:"role"`
	URL      *string `json:"url"`    // 使用指针类型表示可选字段
	Avatar   *string `json:"avatar"` // 使用指针类型表示可选字段
	IP       *string `json:"ip"`     // 使用指针类型表示可选字段
	UA       *string `json:"ua"`     // 使用指针类型表示可选字段
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
	err := DB.Limit(1).Where("email = ? OR username = ?", emailOrName, emailOrName).Find(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
