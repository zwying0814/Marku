package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"marku-server/config"
	"strconv"
	"strings"
	"time"
)

const authTokenTTL = 30 * 24 * time.Hour

// GenerateAuthToken 生成登录令牌
func GenerateAuthToken(userID uint) (string, error) {
	expiresAt := time.Now().Add(authTokenTTL).Unix()
	payload := fmt.Sprintf("%d:%d", userID, expiresAt)
	signature := signAuthPayload(payload)
	encoded := base64.RawURLEncoding.EncodeToString([]byte(payload + ":" + signature))
	return encoded, nil
}

// ParseAuthToken 解析并校验登录令牌
func ParseAuthToken(token string) (uint, error) {
	if strings.TrimSpace(token) == "" {
		return 0, fmt.Errorf("令牌不能为空")
	}

	decoded, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil {
		return 0, fmt.Errorf("令牌无效")
	}

	parts := strings.Split(string(decoded), ":")
	if len(parts) != 3 {
		return 0, fmt.Errorf("令牌格式错误")
	}

	userIDValue, err := strconv.ParseUint(parts[0], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("令牌用户信息无效")
	}

	expiresAt, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("令牌过期信息无效")
	}

	if time.Now().Unix() > expiresAt {
		return 0, fmt.Errorf("令牌已过期")
	}

	payload := parts[0] + ":" + parts[1]
	if !hmac.Equal([]byte(parts[2]), []byte(signAuthPayload(payload))) {
		return 0, fmt.Errorf("令牌签名无效")
	}

	return uint(userIDValue), nil
}

// ExtractBearerToken 从 Authorization 头中提取 Bearer token
func ExtractBearerToken(authorizationHeader string) string {
	trimmed := strings.TrimSpace(authorizationHeader)
	if trimmed == "" {
		return ""
	}

	if len(trimmed) > 7 && strings.EqualFold(trimmed[:7], "Bearer ") {
		return strings.TrimSpace(trimmed[7:])
	}

	return trimmed
}

func signAuthPayload(payload string) string {
	secret := config.AppKey
	if secret == "" {
		secret = "marku"
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}