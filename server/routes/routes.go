package routes

import (
	"marku-server/handle"
	"marku-server/model"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine) {
	// 初始化服务
	db := model.GetDB()
	counterService := model.NewCounterService(db)
	userService := model.NewUserService(db)

	// 初始化处理器
	counterHandler := handle.NewCounterHandler(counterService)
	userHandler := handle.NewUserHandler(userService)

	// API路由组
	api := r.Group("/api")
	{
		// 计数器相关路由
		counters := api.Group("/counters")
		{
			counters.GET("", counterHandler.GetCounter)                  // 查询计数器
			counters.POST("", counterHandler.UpsertCounter)              // 新增或更新计数器
			counters.POST("/increment", counterHandler.IncrementCounter) // 增加计数器数值
			counters.POST("/batch", counterHandler.BatchGetCounters)     // 批量查询计数器
		}

		// 增量操作路由
		increment := api.Group("/increment")
		{
			increment.POST("/batch", counterHandler.BatchIncrementCounters) // 批量增量计数器
		}

		// 用户相关路由
		users := api.Group("/users")
		{
			users.GET("", userHandler.GetAllUsers)       // 获取所有用户
			users.GET("/:id", userHandler.GetUserByID)   // 根据ID获取用户
			users.POST("", userHandler.CreateUser)       // 创建用户
			users.PUT("/:id", userHandler.UpdateUser)    // 更新用户
			users.DELETE("/:id", userHandler.DeleteUser) // 删除用户
		}
	}

	// 健康检查路由
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Server is running",
		})
	})
}
