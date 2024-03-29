# Extract working directory based on jest config file

# Path to Jest config file supplied by VSCode Jest Runner
jest_config=$3

# Remove part after last slash
cwd=$(echo "$jest_config" | sed 's|\(.*\)/.*|\1|')

cd "$cwd"

request="yarn jest '$1' -c $jest_config -t '$5' $6"

eval "$request"

cd ../..