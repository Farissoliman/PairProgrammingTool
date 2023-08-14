# Install prerequisite packages
if [[ $OSTYPE == "darwin"* ]]; then
    echo "Installing Homebrew packages..."
    brew install portaudio
elif [[ $OSTYPE == "linux-gnu"* ]]; then
    if cat /etc/*release | grep ^NAME | grep Fedora; then
        echo "Installing RPM packages..."
        sudo dnf install portaudio portaudio-devel -y
    elif cat /etc/*release | grep ^NAME | grep Ubuntu; then
        echo "Installing Ubuntu packages..."
        sudo apt-get install portaudio19-dev ffmpeg libsm6 libxext6 -y
    else
        echo "Couldn't determine your Linux distro!"
    fi
else
    echo "Couldn't determine your OS!"
fi

# Set up a virtual environment
python3 -m venv .
source ./bin/activate

# Install Python packages
python3 -m pip install -r requirements.txt

echo "Setup complete! Run the commands below to get started:"
echo ""
echo "source ./bin/activate"
echo "python3 run.py <unique-identifier>"
echo ""
