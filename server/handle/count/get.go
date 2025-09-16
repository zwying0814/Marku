package count

import (
	"marku-server/model"
	"marku-server/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// BatchGetCounterRequest 批量查询计数器请求结构
type BatchGetCounterRequest struct {
	SiteID string   `json:"siteid" binding:"required"`
	URL    string   `json:"url" binding:"required"`
	Keys   []string `json:"keys" binding:"required"`
}
// BatchGetCounters 批量查询计数器
func BatchGetCounters(c *gin.Context) {
	var req BatchGetCounterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	counters, err := model.BatchGetCountersByKeys(req.SiteID, req.URL, req.Keys)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to query counters: "+err.Error())
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


