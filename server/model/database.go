package model

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

// InitDatabase 初始化数据库连接
func InitDatabase() {
	var err error
	// 使用文件数据库进行数据持久化
	db, err = gorm.Open(sqlite.Open("data/marku.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 自动迁移数据库表结构
	err = db.AutoMigrate(&Counter{}, &User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated successfully")
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return db
}
