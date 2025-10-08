package config

import (
	"log"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Config 主配置结构体
type Config struct {
	Site     SiteConfig     `yaml:"site"`
	Admin    AdminConfig    `yaml:"admin"`
	Database DatabaseConfig `yaml:"database"`
}

// SiteConfig 站点配置结构体
type SiteConfig struct {
	Port           int      `yaml:"port"`
	AppKey         string   `yaml:"app_key"`
	IPDataPath     string   `yaml:"ip_data_path"`
	LogPath        string   `yaml:"log_path"`
	DropTable      bool     `yaml:"drop_table"`
	AllowedOrigins []string `yaml:"allowed_origins"`
}

// DatabaseConfig 数据库配置结构体
type DatabaseConfig struct {
	Type     string      `yaml:"type"`     // 数据库类型: "sqlite" 或 "mysql"
	SQLite   SQLiteConfig `yaml:"sqlite"`   // SQLite 配置
	MySQL    MySQLConfig  `yaml:"mysql"`    // MySQL 配置
}

// SQLiteConfig SQLite 数据库配置
type SQLiteConfig struct {
	Path string `yaml:"path"` // 数据库文件路径
}

// MySQLConfig MySQL 数据库配置
type MySQLConfig struct {
	Host     string `yaml:"host"`     // 主机地址
	Port     int    `yaml:"port"`     // 端口号
	Username string `yaml:"username"` // 用户名
	Password string `yaml:"password"` // 密码
	Database string `yaml:"database"` // 数据库名
	Charset  string `yaml:"charset"`  // 字符集
}

// AdminConfig 管理员配置结构体
type AdminConfig struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Email    string `yaml:"email"`
}

// 全局配置变量 (保持向后兼容)
var (
	AppKey         string
	IPDataPath     string
	DatabasePath   string // 保持向后兼容，用于 SQLite
	Port           string
	LogFilePath    string
	DropTable      bool
	AllowedOrigins []string
	AdminUsername  string
	AdminPassword  string
	AdminEmail     string
)

// 全局配置实例
var GlobalConfig *Config

// InitConfigFile 函数用于初始化配置文件
func InitConfigFile() {
	// 读取 YAML 配置文件
	data, err := os.ReadFile("config.yaml")
	if err != nil {
		log.Fatalln("配置文件读取错误，请检查文件路径：", err.Error())
	}

	// 解析 YAML 配置
	var config Config
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		log.Fatalln("配置文件解析错误：", err.Error())
	}

	// 保存全局配置实例
	GlobalConfig = &config

	// 设置全局变量 (保持向后兼容)
	setGlobalVariables(&config)
}

// setGlobalVariables 设置全局变量以保持向后兼容
func setGlobalVariables(config *Config) {
	// 站点配置
	if config.Site.Port != 0 {
		Port = strconv.Itoa(config.Site.Port)
	} else {
		Port = "12123" // 默认值
	}
	AppKey = config.Site.AppKey
	IPDataPath = config.Site.IPDataPath
	LogFilePath = config.Site.LogPath
	DropTable = config.Site.DropTable
	AllowedOrigins = config.Site.AllowedOrigins

	// 数据库配置 (保持向后兼容)
	if config.Database.Type == "sqlite" || config.Database.Type == "" {
		DatabasePath = config.Database.SQLite.Path
		if DatabasePath == "" {
			DatabasePath = "./data/marku.bin" // 默认 SQLite 路径
		}
	}

	// 管理员配置
	AdminUsername = config.Admin.Username
	AdminPassword = config.Admin.Password
	AdminEmail = config.Admin.Email
}

// GetSiteConfig 获取站点配置
func GetSiteConfig() *SiteConfig {
	if GlobalConfig != nil {
		return &GlobalConfig.Site
	}
	return nil
}

// GetAdminConfig 获取管理员配置
func GetAdminConfig() *AdminConfig {
	if GlobalConfig != nil {
		return &GlobalConfig.Admin
	}
	return nil
}

// GetAllowedOrigins 获取允许的域名列表
func GetAllowedOrigins() []string {
	if GlobalConfig != nil {
		return GlobalConfig.Site.AllowedOrigins
	}
	return []string{}
}

// GetDatabaseConfig 获取数据库配置
func GetDatabaseConfig() *DatabaseConfig {
	if GlobalConfig != nil {
		return &GlobalConfig.Database
	}
	return nil
}

// GetDatabaseType 获取数据库类型
func GetDatabaseType() string {
	if GlobalConfig != nil && GlobalConfig.Database.Type != "" {
		return GlobalConfig.Database.Type
	}
	return "sqlite" // 默认使用 SQLite
}

// GetMySQLConfig 获取 MySQL 配置
func GetMySQLConfig() *MySQLConfig {
	if GlobalConfig != nil {
		return &GlobalConfig.Database.MySQL
	}
	return nil
}

// GetSQLiteConfig 获取 SQLite 配置
func GetSQLiteConfig() *SQLiteConfig {
	if GlobalConfig != nil {
		return &GlobalConfig.Database.SQLite
	}
	return nil
}
