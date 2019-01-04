export namespace Utils {
    export function toPascalCase(text: string): string {
        return text.match(/[a-z]+/gi)
            .map(function (word) {
                return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
            })
            .join('');
    }
}