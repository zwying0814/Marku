package user

import (
	"fmt"
	"marku-server/config"
	"marku-server/model"
	"marku-server/types"
	"marku-server/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type SendEmailCodeRequest struct {
	Email   string `json:"email" binding:"required,email"`
	Purpose string `json:"purpose" binding:"required"`
}

type VerifyEmailCodeRequest struct {
	Email   string `json:"email" binding:"required,email"`
	Purpose string `json:"purpose" binding:"required"`
	Code    string `json:"code" binding:"required"`
}

type RegisterRequest struct {
	Username  string `json:"username" binding:"required,min=2,max=100"`
	Password  string `json:"password" binding:"required,min=6"`
	Email     string `json:"email" binding:"required,email"`
	EmailCode string `json:"emailCode" binding:"required"`
}

type LoginRequest struct {
	Account  string `json:"account" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RecoverPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	EmailCode   string `json:"emailCode" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

type authUserResponse struct {
	ID       uint    `json:"id"`
	Username string  `json:"username"`
	Email    *string `json:"email,omitempty"`
	Role     int     `json:"role"`
	Token    string  `json:"token,omitempty"`
}

type verifyResponse struct {
	Verified bool `json:"verified"`
}

// SendEmailCode 生成邮箱验证码
func SendEmailCode(c *gin.Context) {
	var req SendEmailCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	purpose := normalizePurpose(req.Purpose)
	if purpose == "" {
		utils.SendError(c, http.StatusBadRequest, "无效的验证码用途")
		return
	}

	record, err := model.GenerateEmailVerificationCode(strings.TrimSpace(req.Email), purpose)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "生成验证码失败: "+err.Error())
		return
	}

	smtpConfig := config.GetSMTPConfig()
	if smtpConfig == nil || !smtpConfig.Enabled {
		_ = model.DeleteEmailVerificationCode(record.ID)
		utils.SendError(c, http.StatusFailedDependency, "SMTP 未启用，请先在配置文件中开启 smtp.enabled")
		return
	}

	subject, body := buildVerificationEmailContent(purpose, record.Code)
	if err := utils.SendSMTPEmail(
		smtpConfig.Host,
		smtpConfig.Port,
		smtpConfig.Username,
		smtpConfig.Password,
		smtpConfig.From,
		smtpConfig.SenderName,
		smtpConfig.Security,
		smtpConfig.SkipVerify,
		[]string{record.Email},
		subject,
		body,
	); err != nil {
		_ = model.DeleteEmailVerificationCode(record.ID)
		utils.SendError(c, http.StatusInternalServerError, "验证码邮件发送失败: "+err.Error())
		return
	}

	utils.SendResponse(c, http.StatusOK, "验证码已生成", gin.H{
		"email":     record.Email,
		"purpose":   record.Purpose,
		"expires_at": record.ExpiresAt,
		"sent":      true,
	})
}

// VerifyEmailCode 校验邮箱验证码
func VerifyEmailCode(c *gin.Context) {
	var req VerifyEmailCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	purpose := normalizePurpose(req.Purpose)
	if purpose == "" {
		utils.SendError(c, http.StatusBadRequest, "无效的验证码用途")
		return
	}

	if err := model.VerifyEmailVerificationCode(strings.TrimSpace(req.Email), purpose, strings.TrimSpace(req.Code)); err != nil {
		utils.SendError(c, http.StatusBadRequest, "验证码校验失败: "+err.Error())
		return
	}

	utils.SendResponse(c, http.StatusOK, "验证码校验成功", verifyResponse{Verified: true})
}

// Register 注册用户
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	username := strings.TrimSpace(req.Username)
	email := strings.TrimSpace(req.Email)
	if username == "" || email == "" || strings.TrimSpace(req.Password) == "" {
		utils.SendError(c, http.StatusBadRequest, "用户名、密码和邮箱不能为空")
		return
	}

	if err := model.VerifyEmailVerificationCode(email, model.EmailPurposeRegister, strings.TrimSpace(req.EmailCode)); err != nil {
		utils.SendError(c, http.StatusBadRequest, "邮箱验证码校验失败: "+err.Error())
		return
	}

	if _, err := model.GetUserByName(username); err == nil {
		utils.SendError(c, http.StatusConflict, "用户名已存在")
		return
	}
	if _, err := model.GetUserByEmail(email); err == nil {
		utils.SendError(c, http.StatusConflict, "邮箱已存在")
		return
	}

	hashedPassword, err := utils.SetPasswordEncrypt(req.Password)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "密码加密失败: "+err.Error())
		return
	}

	user, err := model.CreateUser(username, hashedPassword, email)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "创建用户失败: "+err.Error())
		return
	}

	sendAuthResponse(c, "注册成功", user)
}

// Login 用户登录
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	account := strings.TrimSpace(req.Account)
	user, err := model.FindRegisteredUserByAccount(account)
	if err != nil || user == nil || user.Role == types.RoleGuest || user.Password == nil {
		utils.SendError(c, http.StatusUnauthorized, "账号或密码错误")
		return
	}

	if err := utils.CheckPasswordEncrypt(*user.Password, req.Password); err != nil {
		utils.SendError(c, http.StatusUnauthorized, "账号或密码错误")
		return
	}

	sendAuthResponse(c, "登录成功", user)
}

// RecoverPassword 密码找回
func RecoverPassword(c *gin.Context) {
	var req RecoverPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "无效的请求体: "+err.Error())
		return
	}

	email := strings.TrimSpace(req.Email)
	if err := model.VerifyEmailVerificationCode(email, model.EmailPurposeRecover, strings.TrimSpace(req.EmailCode)); err != nil {
		utils.SendError(c, http.StatusBadRequest, "邮箱验证码校验失败: "+err.Error())
		return
	}

	user, err := model.GetUserByEmail(email)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "用户不存在")
		return
	}

	hashedPassword, err := utils.SetPasswordEncrypt(req.NewPassword)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "密码加密失败: "+err.Error())
		return
	}

	if err := model.UpdateUserPassword(user.ID, hashedPassword); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "更新密码失败: "+err.Error())
		return
	}

	utils.SendResponse(c, http.StatusOK, "密码找回成功", gin.H{"updated": true})
}

func normalizePurpose(purpose string) string {
	switch strings.ToLower(strings.TrimSpace(purpose)) {
	case model.EmailPurposeRegister, model.EmailPurposeRecover, model.EmailPurposeLogin:
		return strings.ToLower(strings.TrimSpace(purpose))
	default:
		return ""
	}
}

func sendAuthResponse(c *gin.Context, message string, user *model.User) {
	if user == nil {
		utils.SendError(c, http.StatusInternalServerError, "用户信息缺失")
		return
	}

	token, err := utils.GenerateAuthToken(user.ID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "生成登录令牌失败: "+err.Error())
		return
	}

	utils.SendResponse(c, http.StatusOK, message, authUserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		Token:    token,
	})
}

// SendAuthSuccess 返回带 token 的登录态响应
func SendAuthSuccess(c *gin.Context, message string, user *model.User) {
	sendAuthResponse(c, message, user)
}

func buildVerificationEmailContent(purpose, code string) (string, string) {
	subjectMap := map[string]string{
		model.EmailPurposeRegister: "Marku 注册验证码",
		model.EmailPurposeRecover:  "Marku 密码找回验证码",
		model.EmailPurposeLogin:    "Marku 登录验证码",
	}
	descMap := map[string]string{
		model.EmailPurposeRegister: "用于完成注册验证",
		model.EmailPurposeRecover:  "用于完成密码找回",
		model.EmailPurposeLogin:    "用于完成登录验证",
	}

	subject := subjectMap[purpose]
	if subject == "" {
		subject = "Marku 验证码"
	}
	desc := descMap[purpose]
	if desc == "" {
		desc = "用于身份验证"
	}

	body := fmt.Sprintf("%s\n\n你的验证码是：%s\n有效期 10 分钟，请勿泄露。\n", desc, code)
	return subject, body
}
