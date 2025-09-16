package config

import (
	"gopkg.in/ini.v1"
	"log"
)

var (
	AppKey        string
	IPDataPath    string
	DatabasePath  string
	Port          string
	LogFilePath   string
	DropTable     bool
	AdminUsername string
	AdminPassword string
	AdminEmail    string
)

// InitConfigFile 函数用于初始化配置文件
func InitConfigFile() {
	// 使用 ini 包的 Load 函数加载配置文件
	file, err := ini.Load("config.ini")
	// 检查加载配置文件时是否发生错误
	if err != nil {
		// 如果发生错误，打印错误信息，提示用户检查文件路径
		log.Fatalln("配置文件读取错误，请检查文件路径：", err.Error())
	}
	// 调用 LoadSiteConfig 函数，传入加载的配置文件对象，加载站点相关配置
	LoadSiteConfig(file)
	LoadAdminConfig(file)
}

// LoadSiteConfig 从ini文件中加载站点配置
func LoadSiteConfig(file *ini.File) {
	Port = file.Section("site").Key("Port").MustString("12123")
	AppKey = file.Section("site").Key("AppKey").MustString("123456789")
	IPDataPath = file.Section("site").Key("IPDataPath").MustString("/data/ip2region.xdb")
	DatabasePath = file.Section("site").Key("DatabasePath").MustString("/data/marku.bin")
	LogFilePath = file.Section("site").Key("LogPath").MustString("/data/log.txt")
	DropTable = file.Section("site").Key("DropTable").MustBool(false)
}

func LoadAdminConfig(file *ini.File) {
	AdminUsername = file.Section("admin").Key("Username").MustString("admin")
	AdminPassword = file.Section("admin").Key("Password").MustString("123456")
	AdminEmail = file.Section("admin").Key("Email").MustString("example@admin.com")
}
