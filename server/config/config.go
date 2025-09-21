package config

import (
	"log"
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Config 主配置结构体
type Config struct {
	Site  SiteConfig  `yaml:"site"`
	Admin AdminConfig `yaml:"admin"`
}

// SiteConfig 站点配置结构体
type SiteConfig struct {
	Port           int      `yaml:"port"`
	AppKey         string   `yaml:"app_key"`
	DatabasePath   string   `yaml:"database_path"`
	IPDataPath     string   `yaml:"ip_data_path"`
	LogPath        string   `yaml:"log_path"`
	DropTable      bool     `yaml:"drop_table"`
	AllowedOrigins []string `yaml:"allowed_origins"`
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
	DatabasePath   string
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
	DatabasePath = config.Site.DatabasePath
	IPDataPath = config.Site.IPDataPath
	LogFilePath = config.Site.LogPath
	DropTable = config.Site.DropTable
	AllowedOrigins = config.Site.AllowedOrigins

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
