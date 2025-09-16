package utils

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// Response 是标准的响应结构体
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"` // omitempty 避免在 data 为 nil 时显示空对象
}

// NewResponse 创建一个新的响应对象
func NewResponse(code int, message string, data interface{}) *Response {
	return &Response{
		Code:    code,
		Message: message,
		Data:    data,
	}
}

// SendResponse 发送 JSON 响应给客户端
func SendResponse(c *gin.Context, code int, message string, data interface{}) {
	response := NewResponse(code, message, data)
	c.JSON(http.StatusOK, response) // 直接使用传入的状态码
}

// SendSuccess 发送成功的 JSON 响应，默认状态码为 200
func SendSuccess(c *gin.Context, data interface{}) {
	SendResponse(c, http.StatusOK, "Success", data)
}

// SendError 发送错误的 JSON 响应，带有指定的状态码和消息
func SendError(c *gin.Context, code int, message string) {
	SendResponse(c, code, message, nil)
}
