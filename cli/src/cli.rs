use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(
    name = "iii-cli",
    about = "Unified CLI dispatcher for iii tools",
    version
)]
pub struct Cli {
    /// Disable background update and advisory checks
    #[arg(long, global = true)]
    pub no_update_check: bool,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Launch the iii web console
    #[command(
        trailing_var_arg = true,
        allow_hyphen_values = true,
        disable_help_flag = true
    )]
    Console {
        /// Arguments passed through to the binary
        #[arg(num_args = 0..)]
        args: Vec<String>,
    },

    /// Create a new iii project from a template
    #[command(
        trailing_var_arg = true,
        allow_hyphen_values = true,
        disable_help_flag = true
    )]
    Create {
        /// Arguments passed through to the binary
        #[arg(num_args = 0..)]
        args: Vec<String>,
    },

    /// Manage SDKs powered by Motia
    #[command(subcommand)]
    Sdk(SdkCommands),

    /// Start the iii process communication engine
    #[command(
        trailing_var_arg = true,
        allow_hyphen_values = true,
        disable_help_flag = true
    )]
    Start {
        /// Arguments passed through to the binary
        #[arg(num_args = 0..)]
        args: Vec<String>,
    },

    /// Update iii-cli and managed binaries to their latest versions
    Update {
        /// Specific command or binary to update (e.g., "console", "self").
        /// Use "self" or "iii-cli" to update only iii-cli.
        /// If omitted, updates iii-cli and all installed binaries.
        #[arg(name = "command")]
        target: Option<String>,
    },

    /// Show installed binaries and their versions
    List,
}

/// SDK subcommands
#[derive(Subcommand)]
pub enum SdkCommands {
    /// Motia SDK tools
    #[command(
        trailing_var_arg = true,
        allow_hyphen_values = true,
        disable_help_flag = true
    )]
    Motia {
        /// Arguments passed through to the binary
        #[arg(num_args = 0..)]
        args: Vec<String>,
    },
}

/// Extract the command name and passthrough args from a parsed Commands value.
pub fn extract_command_info(cmd: &Commands) -> CommandInfo<'_> {
    match cmd {
        Commands::Console { args } => CommandInfo::Dispatch {
            command: "console",
            args,
        },
        Commands::Create { args } => CommandInfo::Dispatch {
            command: "create",
            args,
        },
        Commands::Sdk(sdk_cmd) => match sdk_cmd {
            SdkCommands::Motia { args } => CommandInfo::Dispatch {
                command: "motia",
                args,
            },
        },
        Commands::Start { args } => CommandInfo::Dispatch {
            command: "start",
            args,
        },
        Commands::Update { target } => CommandInfo::Update {
            target: target.as_deref(),
        },
        Commands::List => CommandInfo::List,
    }
}

/// Parsed command information for the main dispatcher.
pub enum CommandInfo<'a> {
    /// Dispatch to a managed binary with passthrough args
    Dispatch {
        command: &'static str,
        args: &'a [String],
    },
    /// Update command
    Update { target: Option<&'a str> },
    /// List installed binaries
    List,
}
