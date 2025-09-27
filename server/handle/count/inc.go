package count

import (
	"marku-server/model"
	"marku-server/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// BatchIncrementCounterRequest 批量增加计数器请求结构
type BatchIncrementCounterRequest struct {
	SiteID   string `json:"siteid" binding:"required"`
	Counters []struct {
		Key       string `json:"key"`
		Increment int64  `json:"increment"`
	} `json:"counters" binding:"required"`
}

// BatchIncrementCounters 批量增加计数器
func BatchIncrementCounters(c *gin.Context) {
	var req BatchIncrementCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	counters, err := model.BatchIncrementCountersByKeys(req.SiteID, req.Counters)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to increment counters: "+err.Error())
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
	utils.SendResponse(c, http.StatusOK, "Success", counterArray)
}
