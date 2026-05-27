package model

import (
	"fmt"
	"marku-server/types"
	"marku-server/utils"
	"strings"
	"time"
)

// User 模型定义
type User struct {
	Username string  `gorm:"size:100;not null;uniqueIndex" json:"username"`
	Password *string `gorm:"size:255" json:"-"`
	Email    *string `gorm:"size:255;uniqueIndex" json:"email"`
	Exp      int     `gorm:"default:0" json:"exp"`
	Role     int     `gorm:"default:1;index" json:"role"`
	URL      *string `gorm:"size:500" json:"url"`
	Avatar   *string `gorm:"size:500" json:"avatar"`
	IP       *string `gorm:"size:45" json:"ip"`
	UA       *string `gorm:"size:1000" json:"ua"`
	Location *string `gorm:"size:100" json:"location"`
	types.BaseModel
}

// GetUserByID 通过用户id找到用户信息
func GetUserByID(id uint) (*User, error) {
	var user User
	if err := DB.Limit(1).Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByName 通过用户Name找到用户信息
func GetUserByName(name string) (*User, error) {
	var user User
	if err := DB.Limit(1).Where("username = ?", name).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail 通过用户email找到用户信息
func GetUserByEmail(email string) (*User, error) {
	var user User
	if err := DB.Limit(1).Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByEmailOrName(emailOrName string) (*User, error) {
	var user User
	if err := DB.Where("email = ? OR username = ?", emailOrName, emailOrName).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// CreateGuestUser 创建游客用户
func CreateGuestUser(username, email, url, ip, ua, location string) (*User, error) {
	user := &User{
		Username: generateGuestUsername(),
		Role:     types.RoleGuest,
	}

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

	if err := DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// CreateUser 创建注册用户
func CreateUser(username, password, email string) (*User, error) {
	username = strings.TrimSpace(username)
	email = strings.TrimSpace(email)
	user := &User{
		Username: username,
		Password: &password,
		Email:    &email,
		Role:     types.RoleUser,
	}

	if err := DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// UpdateUserPassword 更新用户密码
func UpdateUserPassword(userID uint, encryptedPassword string) error {
	return DB.Model(&User{}).Where("id = ?", userID).Update("password", encryptedPassword).Error
}

// FindRegisteredUserByAccount 通过账号找到注册用户
func FindRegisteredUserByAccount(account string) (*User, error) {
	return GetUserByEmailOrName(strings.TrimSpace(account))
}

// VerifyUserPassword 校验密码是否正确
func VerifyUserPassword(user *User, password string) bool {
	if user == nil || user.Password == nil {
		return false
	}
	return utils.CheckPasswordEncrypt(*user.Password, password) == nil
}

// generateGuestUsername 生成游客用户名
func generateGuestUsername() string {
	return "guest_" + fmt.Sprintf("%d", time.Now().UnixNano())
}