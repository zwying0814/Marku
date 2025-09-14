package model

import (
	"errors"

	"gorm.io/gorm"
)

// Counter 计数器数据模型
type Counter struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	SiteID string `gorm:"not null;index:idx_counter,unique" json:"site_id"`
	URL    string `gorm:"not null;index:idx_counter,unique" json:"url"`
	Key    string `gorm:"not null;index:idx_counter,unique" json:"key"`
	Num    int64  `gorm:"default:0" json:"num"`
}

// CounterService 计数器服务
type CounterService struct {
	db *gorm.DB
}

// NewCounterService 创建计数器服务实例
func NewCounterService(db *gorm.DB) *CounterService {
	return &CounterService{db: db}
}

// GetCounterByKeys 根据siteid、url、key查询计数器
func (s *CounterService) GetCounterByKeys(siteID, url, key string) (*Counter, error) {
	var counter Counter
	err := s.db.Where("site_id = ? AND url = ? AND key = ?", siteID, url, key).First(&counter).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // 记录不存在，返回nil而不是错误
		}
		return nil, err
	}
	return &counter, nil
}

// BatchGetCountersByKeys 批量根据siteid、url、keys查询计数器
func (s *CounterService) BatchGetCountersByKeys(siteID, url string, keys []string) (map[string]*Counter, error) {
	var counters []Counter
	err := s.db.Where("site_id = ? AND url = ? AND key IN ?", siteID, url, keys).Find(&counters).Error
	if err != nil {
		return nil, err
	}

	// 将结果转换为map，key为counter的key，value为counter对象
	result := make(map[string]*Counter)
	for i := range counters {
		result[counters[i].Key] = &counters[i]
	}

	// 对于没有找到的key，添加默认值为0的counter
	for _, key := range keys {
		if _, exists := result[key]; !exists {
			result[key] = &Counter{
				SiteID: siteID,
				URL:    url,
				Key:    key,
				Num:    0,
			}
		}
	}

	return result, nil
}

// UpsertCounter 新增或更新计数器
func (s *CounterService) UpsertCounter(siteID, url, key string, num int64) (*Counter, error) {
	var counter Counter

	// 查找现有记录
	err := s.db.Where("site_id = ? AND url = ? AND key = ?", siteID, url, key).First(&counter).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 记录不存在，创建新记录
			counter = Counter{
				SiteID: siteID,
				URL:    url,
				Key:    key,
				Num:    num,
			}
			err = s.db.Create(&counter).Error
			if err != nil {
				return nil, err
			}
			return &counter, nil
		}
		return nil, err
	}

	// 记录存在，更新数值
	counter.Num = num
	err = s.db.Save(&counter).Error
	if err != nil {
		return nil, err
	}

	return &counter, nil
}

// IncrementCounter 增加计数器数值
func (s *CounterService) IncrementCounter(siteID, url, key string, increment int64) (*Counter, error) {
	var counter Counter

	// 查找现有记录
	err := s.db.Where("site_id = ? AND url = ? AND key = ?", siteID, url, key).First(&counter).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 记录不存在，创建新记录
			counter = Counter{
				SiteID: siteID,
				URL:    url,
				Key:    key,
				Num:    increment,
			}
			err = s.db.Create(&counter).Error
			if err != nil {
				return nil, err
			}
			return &counter, nil
		}
		return nil, err
	}

	// 记录存在，增加数值
	counter.Num += increment
	err = s.db.Save(&counter).Error
	if err != nil {
		return nil, err
	}

	return &counter, nil
}

// BatchIncrementCounters 批量增加计数器数值
func (s *CounterService) BatchIncrementCounters(siteID, url string, counters []struct {
	Key       string `json:"key"`
	Increment int64  `json:"increment"`
}) (map[string]*Counter, error) {
	result := make(map[string]*Counter)

	// 使用事务确保数据一致性
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, item := range counters {
		var counter Counter

		// 查找现有记录
		err := tx.Where("site_id = ? AND url = ? AND key = ?", siteID, url, item.Key).First(&counter).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// 记录不存在，创建新记录
				counter = Counter{
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
