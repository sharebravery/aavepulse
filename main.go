package main

import (
	"os"

	"github.com/jeremyzhou/aavepulse/cmd"
	"github.com/urfave/cli/v2"
)

// Usage: go build -ldflags "-X main.VERSION=x.x.x"
var VERSION = "v0.1.0"

// @title aavepulse
// @version v0.1.0
// @description A read-only Aave V3 data monitoring service
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @schemes http https
// @basePath /
func main() {
	app := cli.NewApp()
	app.Name = "aavepulse"
	app.Version = VERSION
	app.Usage = "A read-only Aave V3 data monitoring service"
	app.Commands = []*cli.Command{
		cmd.StartCmd(),
		cmd.StopCmd(),
		cmd.VersionCmd(VERSION),
	}
	err := app.Run(os.Args)
	if err != nil {
		panic(err)
	}
}
