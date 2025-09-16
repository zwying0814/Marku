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