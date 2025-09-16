package main

import (
	"marku-server/config"
	"marku-server/model"
	"marku-server/routes"
	"marku-server/logs"
)


func main() {
	// 初始化配置文件
	config.InitConfigFile()
	// 初始化日志系统
	logs.InitLogger()
	// 初始化数据库
	model.InitDatabase()
	// 初始化路由
	routes.InitRouter()
}