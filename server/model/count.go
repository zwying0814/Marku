package model

import (
	"errors"
	"marku-server/types"

	"gorm.io/gorm"
)

// Count 计数器数据模型
type Count struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	SiteID string `gorm:"not null;index:idx_counter,unique" json:"site_id"`
	URL    string `gorm:"not null;index:idx_counter,unique" json:"url"`
	Key    string `gorm:"not null;index:idx_counter,unique" json:"key"`
	Num    int64  `gorm:"default:0" json:"num"`
	types.BaseModel
}

// BatchGetCountersByKeys 批量根据siteid、url、keys查询计数器
func BatchGetCountersByKeys(siteID, url string, keys []string) (map[string]*Count, error) {
	var counters []Count
	err := DB.Where("site_id = ? AND url = ? AND key IN ?", siteID, url, keys).Find(&counters).Error
	if err != nil {
		return nil, err
	}

	// 将结果转换为map，key为counter的key，value为counter对象
	result := make(map[string]*Count)
	for i := range counters {
		result[counters[i].Key] = &counters[i]
	}

	// 对于没有找到的key，添加默认值为0的counter
	for _, key := range keys {
		if _, exists := result[key]; !exists {
			result[key] = &Count{
				SiteID: siteID,
				URL:    url,
				Key:    key,
				Num:    0,
			}
		}
	}

	return result, nil
}

// BatchIncrementCountersByKeys 批量增加计数器数值
func BatchIncrementCountersByKeys(siteID, url string, counters []struct {
	Key       string `json:"key"`
	Increment int64  `json:"increment"`
}) (map[string]*Count, error) {
	result := make(map[string]*Count)

	// 使用事务确保数据一致性
	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, item := range counters {
		var counter Count

		// 查找现有记录
		err := tx.Where("site_id = ? AND url = ? AND key = ?", siteID, url, item.Key).First(&counter).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// 记录不存在，创建新记录
				counter = Count{
					SiteID: siteID,
					URL:    url,
					Key:    item.Key,
					Num:    item.Increment,
				}
				err = tx.Create(&counter).Error
				if err != nil {
					tx.Rollback()
					return nil, err
				}
			} else {
				tx.Rollback()
				return nil, err
			}
		} else {
			// 记录存在，增加数值
			counter.Num += item.Increment
			err = tx.Save(&counter).Error
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}

		result[item.Key] = &counter
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return result, nil
}