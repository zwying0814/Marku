package utils

import (
	"golang.org/x/crypto/bcrypt"
)

// SetPasswordEncrypt 设置密码加密
func SetPasswordEncrypt(password string) (encodedPassword string, err error) {
	var encrypted []byte
	if encrypted, err = bcrypt.GenerateFromPassword(
		[]byte(password), bcrypt.DefaultCost,
	); err != nil {
		return "", err
	}
	encode := string(encrypted)
	return encode, nil
}

// CheckPasswordEncrypt 校验已加密密码是否与明文密码一致
func CheckPasswordEncrypt(encodedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(encodedPassword), []byte(password))
}
