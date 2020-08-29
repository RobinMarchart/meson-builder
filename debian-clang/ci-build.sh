#! /usr/bin/env sh

case "${INPUT_SANITIZER}" in
    none)
        echo "using no sanitizer"
        ;;
    address)
        echo "using address sanitizer"
        INPUT_OPTIONS="${INPUT_OPTIONS} -Db_sanitize=address"
        ;;
    thread)
        echo "using thread sanitizer"
        INPUT_OPTIONS="${INPUT_OPTIONS} -Db_sanitize=thread"
        ;;
    undefined)
        echo "using UB sanitizer"
        INPUT_OPTIONS="${INPUT_OPTIONS} -Db_sanitize=undefined"
        ;;
    memory)
        echo "using memory sanitizer"
        INPUT_OPTIONS="${INPUT_OPTIONS} -Db_sanitize=memory"
        ;;
    *)
        echo "sanitizer ${INPUT_SANITIZER} not allowed"
        exit 1
        ;;
esac

meson setup ${INPUT_OPTIONS} "${INPUT_BUILD_DIR}"
cd "${INPUT_BUILD_DIR}"
meson configure
ninja
meson test
