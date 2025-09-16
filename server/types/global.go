package types

import "time"

type UriID struct {
	ID uint `uri:"id" binding:"required"`
}
type BaseModel struct {
	ID        uint       `gorm:"column:id" json:"id"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"deleted_at"`
}
