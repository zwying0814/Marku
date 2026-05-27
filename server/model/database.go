package model

import (
	"fmt"
	"log"
	"marku-server/config"
	"marku-server/types"
	"marku-server/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	DB *gorm.DB
)

// InitDatabase 初始化数据库连接
func InitDatabase() {
	var err error
	
	// 根据配置选择数据库类型
	dbType := config.GetDatabaseType()
	
	switch dbType {
	case "mysql":
		DB, err = initMySQLDatabase()
	case "sqlite":
		DB, err = initSQLiteDatabase()
	default:
		log.Printf("未知的数据库类型: %s，使用默认的 SQLite", dbType)
		DB, err = initSQLiteDatabase()
	}
	
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	if config.DropTable {
		//清空表
		err = DB.Migrator().DropTable(&User{}, &Count{}, &Comment{}, &EmailVerificationCode{})
		if err != nil {
			log.Fatalln("清空表失败！")
		}
	}

	// 自动迁移数据库
	err = DB.AutoMigrate(&User{}, &Count{}, &Comment{}, &EmailVerificationCode{})
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
			Password: &psw,
			Email:    &config.AdminEmail,
			Role:     types.RoleAdmin,
		}).Error
		if err != nil {
			log.Fatalln("初始化管理员账户失败！")
		}
	}
	
	log.Printf("数据库初始化成功，使用 %s 数据库", dbType)
}

// initSQLiteDatabase 初始化 SQLite 数据库连接
func initSQLiteDatabase() (*gorm.DB, error) {
	sqliteConfig := config.GetSQLiteConfig()
	if sqliteConfig == nil || sqliteConfig.Path == "" {
		return nil, fmt.Errorf("SQLite 配置不完整")
	}
	
	log.Printf("正在连接 SQLite 数据库: %s", sqliteConfig.Path)
	return gorm.Open(sqlite.Open(sqliteConfig.Path), &gorm.Config{})
}

// initMySQLDatabase 初始化 MySQL 数据库连接
func initMySQLDatabase() (*gorm.DB, error) {
	mysqlConfig := config.GetMySQLConfig()
	if mysqlConfig == nil {
		return nil, fmt.Errorf("MySQL 配置不完整")
	}
	
	// 构建 MySQL DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		mysqlConfig.Username,
		mysqlConfig.Password,
		mysqlConfig.Host,
		mysqlConfig.Port,
		mysqlConfig.Database,
		mysqlConfig.Charset,
	)
	
	log.Printf("正在连接 MySQL 数据库: %s@%s:%d/%s", 
		mysqlConfig.Username, mysqlConfig.Host, mysqlConfig.Port, mysqlConfig.Database)
	
	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}