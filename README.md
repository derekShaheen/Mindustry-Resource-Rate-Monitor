# Resource Rate Display Mod

This mod enhances the user interface of the game by displaying resource rate changes in real-time. Without this mod, the game does not show the rate of change for resources, making it difficult to track resource production and consumption effectively.

![Screenshot](media/Screenshot%202024-05-25%20020010.png)

## Features

- Displays resource rate changes for all core resources.
- Highlights positive resource rate changes in green and negative changes in red.
- Updates the display every second to show real-time changes.
- Formats large numbers for better readability (e.g., 102345 becomes 102.3k).

### Videos

[![Watch the video](media/Screenshot%202024-05-25%20020010.png)](media/2024-05-25%2002-04-32.mkv)
[![Watch the video](media/Screenshot%202024-05-25%20015842.png)](media/2024-05-25%2002-00-43.mkv)

### Screenshots

![Screenshot](media/Screenshot%202024-05-25%20015842.png)
![Screenshot](media/Screenshot%202024-05-25%20010410.png)

## Installation

1. Download the latest release from the [Releases](https://github.com/yourusername/resourceratedisplay/releases) page.
2. Extract the contents into your game's mods directory.
3. Launch the game and enable the mod from the mods menu.

## Usage

Once the mod is installed and enabled, it will automatically start displaying resource rate changes in the core resource panel.

## How It Works

The mod tracks changes in resource amounts over a specified time span (default is 1 second). It calculates the difference between the current amount and the amount from the previous time span, then updates the display with the new values.