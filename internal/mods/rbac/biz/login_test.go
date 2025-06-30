package biz

import (
	"context"
	"testing"

	"github.com/jeremyzhou/aavepulse/internal/config"
	"github.com/stretchr/testify/require"
)

func TestGetCaptchaDisablesChallengeInDemoMode(t *testing.T) {
	previous := config.C.DeFi.Demo
	config.C.DeFi.Demo = true
	t.Cleanup(func() { config.C.DeFi.Demo = previous })

	challenge, err := (&Login{}).GetCaptcha(context.Background())
	require.NoError(t, err)
	require.False(t, challenge.Enabled)
	require.Empty(t, challenge.CaptchaID)
}

func TestGetCaptchaEnablesChallengeOutsideDemoMode(t *testing.T) {
	previous := config.C.DeFi.Demo
	config.C.DeFi.Demo = false
	t.Cleanup(func() { config.C.DeFi.Demo = previous })

	challenge, err := (&Login{}).GetCaptcha(context.Background())
	require.NoError(t, err)
	require.True(t, challenge.Enabled)
	require.NotEmpty(t, challenge.CaptchaID)
}
