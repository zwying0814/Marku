package model

import (
	"errors"

	"gorm.io/gorm"
)

// User 用户数据模型
type User struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Name  string `gorm:"not null" json:"name"`
	Email string `gorm:"not null;unique" json:"email"`
}

// UserService 用户服务
type UserService struct {
	db *gorm.DB
}

// NewUserService 创建用户服务实例
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// GetAllUsers 获取所有用户
func (s *UserService) GetAllUsers() ([]User, error) {
	var users []User
	err := s.db.Find(&users).Error
	return users, err
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id uint) (*User, error) {
	var user User
	err := s.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// CreateUser 创建用户
func (s *UserService) CreateUser(name, email string) (*User, error) {
	user := User{
		Name:  name,
		Email: email,
	}
	err := s.db.Create(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser 更新用户
func (s *UserService) UpdateUser(id uint, name, email string) (*User, error) {
	var user User
	err := s.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	
	user.Name = name
	user.Email = email
	err = s.db.Save(&user).Error
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}

// DeleteUser 删除用户
func (s *UserService) DeleteUser(id uint) error {
	result := s.db.Delete(&User{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}