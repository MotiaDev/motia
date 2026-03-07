// Copyright Motia LLC and/or licensed to Motia LLC under one or more
// contributor license agreements. Licensed under the Elastic License 2.0;
// you may not use this file except in compliance with the Elastic License 2.0.
// This software is patent protected. We welcome discussions - reach out at support@motia.dev
// See LICENSE and PATENTS files for details.

use clap::Parser;
use iii::{
    EngineBuilder, logging,
    modules::config::{DEFAULT_PORT, EngineConfig},
};

#[derive(Parser, Debug)]
#[command(name = "engine", about = "Process communication engine")]
struct Args {
    /// Path to the config file (default: config.yaml)
    #[arg(short, long, default_value = "config.yaml")]
    config: String,

    /// Print version and exit
    #[arg(short = 'v', long)]
    version: bool,

    /// Run with built-in defaults instead of a config file.
    /// Cannot be combined with --config.
    #[arg(long, conflicts_with = "config")]
    use_default_config: bool,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    if args.version {
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    if args.use_default_config {
        logging::init_log_from_config(None);
        let config = EngineConfig::default_config();
        let port = if config.port == 0 {
            DEFAULT_PORT
        } else {
            config.port
        };

        EngineBuilder::new()
            .default_config()
            .address(format!("0.0.0.0:{}", port).as_str())
            .build()
            .await?
            .serve()
            .await?;
    } else {
        logging::init_log_from_config(Some(&args.config));
        let config = EngineConfig::config_file(&args.config)?;
        let port = if config.port == 0 {
            DEFAULT_PORT
        } else {
            config.port
        };

        EngineBuilder::new()
            .config_file(&args.config)?
            .address(format!("0.0.0.0:{}", port).as_str())
            .build()
            .await?
            .serve()
            .await?;
    }

    Ok(())
}
