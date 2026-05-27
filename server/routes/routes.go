package routes

import (
	"log"
	"marku-server/config"
	"marku-server/handle/app"
	"marku-server/handle/comment"
	"marku-server/handle/count"
	userhandler "marku-server/handle/user"
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

		// 评论提交
		public.POST("/comment/submit", comment.SubmitComment)
		// 评论列表
		public.GET("/comment/list", comment.GetComments)

		// 用户模块
		user := public.Group("/user")
		{
			user.POST("/register", userhandler.Register)
			user.POST("/login", userhandler.Login)
			user.POST("/password/recover", userhandler.RecoverPassword)
			user.POST("/email/code/send", userhandler.SendEmailCode)
			user.POST("/email/code/verify", userhandler.VerifyEmailCode)
		}
	}

	_ = r.Run(":" + config.Port)
	log.Println("Server starting on :" + config.Port)
}
