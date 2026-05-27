package model

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"
)

const (
	EmailPurposeRegister = "register"
	EmailPurposeRecover  = "recover"
	EmailPurposeLogin    = "login"
)

// EmailVerificationCode 邮箱验证码记录
type EmailVerificationCode struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Email     string     `gorm:"size:255;not null;index:idx_email_purpose,priority:1" json:"email"`
	Purpose   string     `gorm:"size:32;not null;index:idx_email_purpose,priority:2" json:"purpose"`
	Code      string     `gorm:"size:16;not null" json:"code"`
	ExpiresAt time.Time  `gorm:"not null;index" json:"expires_at"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"deleted_at,omitempty"`
	VerifiedAt *time.Time `gorm:"index" json:"verified_at,omitempty"`
}

// GenerateEmailVerificationCode 创建邮箱验证码
func GenerateEmailVerificationCode(email, purpose string) (*EmailVerificationCode, error) {
	code, err := randomNumericCode(6)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	record := &EmailVerificationCode{
		Email:     email,
		Purpose:   purpose,
		Code:      code,
		ExpiresAt: now.Add(10 * time.Minute),
	}

	if err := DB.Where("email = ? AND purpose = ?", email, purpose).Delete(&EmailVerificationCode{}).Error; err != nil {
		return nil, err
	}

	if err := DB.Create(record).Error; err != nil {
		return nil, err
	}

	return record, nil
}

// VerifyEmailVerificationCode 校验邮箱验证码
func VerifyEmailVerificationCode(email, purpose, code string) error {
	var record EmailVerificationCode
	if err := DB.Where("email = ? AND purpose = ? AND code = ?", email, purpose, code).Order("created_at DESC").First(&record).Error; err != nil {
		return err
	}

	now := time.Now()
	if now.After(record.ExpiresAt) {
		_ = DB.Delete(&record).Error
		return fmt.Errorf("验证码已过期")
	}

	if record.VerifiedAt != nil {
		return fmt.Errorf("验证码已使用")
	}

	record.VerifiedAt = &now
	if err := DB.Delete(&record).Error; err != nil {
		return err
	}
	return nil
}

// DeleteEmailVerificationCode 删除验证码记录
func DeleteEmailVerificationCode(id uint) error {
	return DB.Delete(&EmailVerificationCode{}, id).Error
}

func randomNumericCode(length int) (string, error) {
	if length <= 0 {
		return "", fmt.Errorf("验证码长度无效")
	}

	max := big.NewInt(10)
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		result[i] = byte('0' + num.Int64())
	}

	return string(result), nil
}