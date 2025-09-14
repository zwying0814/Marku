package handle

import (
	"net/http"

	"marku-server/model"

	"github.com/gin-gonic/gin"
)

// CounterHandler 计数器处理器
type CounterHandler struct {
	counterService *model.CounterService
}

// NewCounterHandler 创建计数器处理器实例
func NewCounterHandler(counterService *model.CounterService) *CounterHandler {
	return &CounterHandler{
		counterService: counterService,
	}
}

// GetCounterRequest 查询计数器请求结构
type GetCounterRequest struct {
	SiteID string `form:"siteid" binding:"required"`
	URL    string `form:"url" binding:"required"`
	Key    string `form:"key" binding:"required"`
}

// UpsertCounterRequest 新增或更新计数器请求结构
type UpsertCounterRequest struct {
	SiteID string `json:"siteid" binding:"required"`
	URL    string `json:"url" binding:"required"`
	Key    string `json:"key" binding:"required"`
	Num    int64  `json:"num" binding:"required"`
}

// IncrementCounterRequest 增加计数器请求结构
type IncrementCounterRequest struct {
	SiteID    string `json:"siteid" binding:"required"`
	URL       string `json:"url" binding:"required"`
	Key       string `json:"key" binding:"required"`
	Increment int64  `json:"increment" binding:"required"`
}

// BatchGetCounterRequest 批量查询计数器请求结构
type BatchGetCounterRequest struct {
	SiteID string   `json:"siteid" binding:"required"`
	URL    string   `json:"url" binding:"required"`
	Keys   []string `json:"keys" binding:"required"`
}

// BatchIncrementCounterRequest 批量增量计数器请求结构
type BatchIncrementCounterRequest struct {
	SiteID   string `json:"siteId" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Counters []struct {
		Key       string `json:"key"`
		Increment int64  `json:"increment"`
	} `json:"counters" binding:"required"`
}

// APIResponse 统一API响应结构
type APIResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// GetCounter 查询计数器
func (h *CounterHandler) GetCounter(c *gin.Context) {
	var req GetCounterRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Code:    400,
			Message: "Invalid request parameters: " + err.Error(),
		})
		return
	}

	counter, err := h.counterService.GetCounterByKeys(req.SiteID, req.URL, req.Key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Code:    500,
			Message: "Failed to query counter: " + err.Error(),
		})
		return
	}

	if counter == nil {
		c.JSON(http.StatusNotFound, APIResponse{
			Code:    404,
			Message: "Counter not found",
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Code:    200,
		Message: "Success",
		Data:    counter,
	})
}

// UpsertCounter 新增或更新计数器
func (h *CounterHandler) UpsertCounter(c *gin.Context) {
	var req UpsertCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Code:    400,
			Message: "Invalid request body: " + err.Error(),
		})
		return
	}

	counter, err := h.counterService.UpsertCounter(req.SiteID, req.URL, req.Key, req.Num)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Code:    500,
			Message: "Failed to upsert counter: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Code:    200,
		Message: "Counter upserted successfully",
		Data:    counter,
	})
}

// IncrementCounter 增加计数器数值
func (h *CounterHandler) IncrementCounter(c *gin.Context) {
	var req IncrementCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Code:    400,
			Message: "Invalid request body: " + err.Error(),
		})
		return
	}

	counter, err := h.counterService.IncrementCounter(req.SiteID, req.URL, req.Key, req.Increment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Code:    500,
			Message: "Failed to increment counter: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Code:    200,
		Message: "Counter incremented successfully",
		Data:    counter,
	})
}

// BatchGetCounters 批量查询计数器
func (h *CounterHandler) BatchGetCounters(c *gin.Context) {
	var req BatchGetCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Code:    400,
			Message: "Invalid request body: " + err.Error(),
		})
		return
	}

	counters, err := h.counterService.BatchGetCountersByKeys(req.SiteID, req.URL, req.Keys)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Code:    500,
			Message: "Failed to query counters: " + err.Error(),
		})
		return
	}

	// 将map转换为数组格式
	var counterArray []map[string]interface{}
	for _, counter := range counters {
		counterArray = append(counterArray, map[string]interface{}{
			"key": counter.Key,
			"num": counter.Num,
		})
	}

	c.JSON(http.StatusOK, APIResponse{
		Code:    200,
		Message: "Success",
		Data:    counterArray,
	})
}

// BatchIncrementCounters 批量增量计数器
func (h *CounterHandler) BatchIncrementCounters(c *gin.Context) {
	var req BatchIncrementCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Code:    400,
			Message: "Invalid request body: " + err.Error(),
		})
		return
	}

	counters, err := h.counterService.BatchIncrementCounters(req.SiteID, req.URL, req.Counters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Code:    500,
			Message: "Failed to increment counters: " + err.Error(),
		})
		return
	}

	// 将结果转换为与BatchGetCounters一致的格式
	var counterArray []map[string]interface{}
	for _, counter := range counters {
		counterArray = append(counterArray, map[string]interface{}{
			"key": counter.Key,
			"num": counter.Num,
		})
	}

	c.JSON(http.StatusOK, APIResponse{
		Code:    200,
		Message: "Counters incremented successfully",
		Data:    counterArray,
	})
}
