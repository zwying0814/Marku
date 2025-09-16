package routes

import (
	"log"
	"marku-server/config"
	"marku-server/handle/app"
	"marku-server/handle/count"
	"marku-server/middleware"

	"github.com/gin-gonic/gin"
)

func InitRouter() {
	r := gin.Default()
	//r.Use(middleware.Logger())
	r.Use(middleware.Cors())

	// 公开路由
	public := r.Group("api")
	{
		// 健康检查
		public.GET("/health", app.HealthCheck)

		// 计数器批量查询
		public.POST("/count/batch", count.BatchGetCounters)
		// 计数器批量增量
		public.POST("/increment/batch", count.BatchIncrementCounters)
	}

	_ = r.Run(":" + config.Port)
	log.Println("Server starting on :" + config.Port)
}
