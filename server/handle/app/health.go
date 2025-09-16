package app

import (
	"marku-server/utils"
	"time"

	"github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
	var HealthData = map[string]interface{}{
		"status": "healthy",
		"timestamp": time.Now().Unix(),
	}
	utils.SendSuccess(c, HealthData)
}