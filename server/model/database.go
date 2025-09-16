package model

import (
	"log"
	"marku-server/config"
	"marku-server/types"
	"marku-server/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var (
	DB *gorm.DB
)

// InitDatabase 初始化数据库连接
func InitDatabase() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.DatabasePath), &gorm.Config{})
	if err != nil {
		log.Fatalln("数据库初始化失败！")
	}

	if config.DropTable {
		//清空表
		err = DB.Migrator().DropTable(&User{}, &Count{})
		if err != nil {
			log.Fatalln("清空表失败！")
		}
	}

	// 自动迁移数据库
	err = DB.AutoMigrate(&User{}, &Count{})
	if err != nil {
		log.Fatalln("数据库迁移失败！")
	}

	if config.DropTable {
		// 初始化管理员账户
		psw, err := utils.SetPasswordEncrypt(config.AdminPassword)
		if err != nil {
			log.Fatalln("密码加密失败！")
		}
		err = DB.Create(&User{
			Username: config.AdminUsername,
			Password: psw,
			Email:    config.AdminEmail,
			Role:     types.RoleAdmin,
		}).Error
		if err != nil {
			log.Fatalln("初始化管理员账户失败！")
		}
	}
}