package utils

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/smtp"
	"strings"
)

// SendSMTPEmail 通过 SMTP 发送邮件
func SendSMTPEmail(host string, port int, username, password, from, senderName, security string, skipVerify bool, to []string, subject, body string) error {
	if strings.TrimSpace(host) == "" {
		return fmt.Errorf("SMTP 主机不能为空")
	}
	if port <= 0 {
		return fmt.Errorf("SMTP 端口无效")
	}
	if len(to) == 0 {
		return fmt.Errorf("收件人不能为空")
	}

	fromAddress := extractEmailAddress(from)
	if fromAddress == "" {
		fromAddress = strings.TrimSpace(username)
	}
	if fromAddress == "" {
		return fmt.Errorf("发件人地址不能为空")
	}

	auth := smtp.PlainAuth("", username, password, host)
	message := buildSMTPMessage(fromAddress, senderName, to, subject, body)
	address := fmt.Sprintf("%s:%d", host, port)

	switch strings.ToLower(strings.TrimSpace(security)) {
	case "ssl":
		return sendSMTPViaTLS(address, host, auth, fromAddress, to, message, skipVerify)
	case "plain":
		return sendSMTPPlain(address, auth, fromAddress, to, message)
	default:
		return sendSMTPStartTLS(address, host, auth, fromAddress, to, message, skipVerify)
	}
}

func sendSMTPPlain(address string, auth smtp.Auth, from string, to []string, message []byte) error {
	if err := smtp.SendMail(address, auth, from, to, message); err != nil {
		return err
	}
	return nil
}

func sendSMTPStartTLS(address, host string, auth smtp.Auth, from string, to []string, message []byte, skipVerify bool) error {
	conn, err := net.Dial("tcp", address)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()

	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{ServerName: host, InsecureSkipVerify: skipVerify}
		if err := client.StartTLS(tlsConfig); err != nil {
			return err
		}
	}

	if auth != nil {
		if ok, _ := client.Extension("AUTH"); ok {
			if err := client.Auth(auth); err != nil {
				return err
			}
		}
	}

	if err := client.Mail(from); err != nil {
		return err
	}
	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(message); err != nil {
		_ = writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func sendSMTPViaTLS(address, host string, auth smtp.Auth, from string, to []string, message []byte, skipVerify bool) error {
	tlsConfig := &tls.Config{ServerName: host, InsecureSkipVerify: skipVerify}
	conn, err := tls.Dial("tcp", address, tlsConfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()

	if auth != nil {
		if ok, _ := client.Extension("AUTH"); ok {
			if err := client.Auth(auth); err != nil {
				return err
			}
		}
	}

	if err := client.Mail(from); err != nil {
		return err
	}
	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(message); err != nil {
		_ = writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}

func buildSMTPMessage(fromAddress, senderName string, to []string, subject, body string) []byte {
	var buffer bytes.Buffer
	buffer.WriteString(fmt.Sprintf("From: %s\r\n", formatAddress(fromAddress, senderName)))
	buffer.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(to, ", ")))
	buffer.WriteString("MIME-Version: 1.0\r\n")
	buffer.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	buffer.WriteString("Content-Transfer-Encoding: 8bit\r\n")
	buffer.WriteString(fmt.Sprintf("Subject: %s\r\n", encodeSubject(subject)))
	buffer.WriteString("\r\n")
	buffer.WriteString(body)
	return buffer.Bytes()
}

func formatAddress(address, senderName string) string {
	name := strings.TrimSpace(senderName)
	if name == "" {
		return address
	}
	return fmt.Sprintf("%s <%s>", encodePhrase(name), address)
}

func encodePhrase(value string) string {
	if value == "" {
		return ""
	}
	return fmt.Sprintf("=?UTF-8?B?%s?=", base64.StdEncoding.EncodeToString([]byte(value)))
}

func encodeSubject(value string) string {
	return encodePhrase(value)
}

func extractEmailAddress(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if start := strings.Index(value, "<"); start >= 0 {
		if end := strings.Index(value[start:], ">"); end > 0 {
			return strings.TrimSpace(value[start+1 : start+end])
		}
	}
	return value
}