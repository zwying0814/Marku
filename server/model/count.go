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
	Mark   string `gorm:"not null;index:idx_counter,unique" json:"mark"`
	Num    int64  `gorm:"default:0" json:"num"`
	types.BaseModel
}

// BatchGetCountersByMarks 批量根据siteid、marks查询计数器
func BatchGetCountersByMarks(siteID string, marks []string) (map[string]*Count, error) {
	var counters []Count
	err := DB.Where("site_id = ? AND mark IN ?", siteID, marks).Find(&counters).Error
	if err != nil {
		return nil, err
	}

	// 将结果转换为map
	result := make(map[string]*Count)
	for i := range counters {
		result[counters[i].Mark] = &counters[i]
	}

	// 对于没有找到的mark，添加默认值为0的counter
	for _, mark := range marks {
		if _, exists := result[mark]; !exists {
			result[mark] = &Count{
				SiteID: siteID,
				Mark:   mark,
				Num:    0,
			}
		}
	}

	return result, nil
}

// BatchIncrementCountersByMarks 批量增加计数器数值
func BatchIncrementCountersByMarks(siteID string, counters []struct {
	Mark      string `json:"mark"`	
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
		err := tx.Where("site_id = ? AND mark = ?", siteID, item.Mark).First(&counter).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// 记录不存在，创建新记录
				counter = Count{
					SiteID: siteID,
					Mark:   item.Mark,
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

		result[item.Mark] = &counter
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return result, nil
}
