package main

import (
	"log"
	"net/http"

	"marku-server/model"
	"marku-server/routes"
	"github.com/gin-gonic/gin"
)

// CORS中间件
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 允许的域名列表
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:5500",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5500",
			"file://", // 允许本地文件访问
		}

		origin := c.Request.Header.Get("Origin")
		
		// 检查是否为允许的域名
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		// 如果是本地文件访问，也允许
		if origin == "" || (len(origin) >= 7 && origin[:7] == "file://") {
			allowed = true
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func main() {
	// 初始化数据库
	model.InitDatabase()

	// 创建Gin路由器
	r := gin.Default()

	// 添加CORS中间件
	r.Use(CORSMiddleware())

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	log.Println("Server starting on :8080")
	log.Fatal(r.Run(":8080"))
}