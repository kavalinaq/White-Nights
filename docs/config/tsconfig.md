# tsconfig.json / tsconfig.app.json (frontend)

## Назначение

Файлы конфигурации TypeScript компилятора. `tsconfig.json` — корневой файл-оркестратор, который ссылается на `tsconfig.app.json` (настройки для исходного кода) и `tsconfig.node.json` (настройки для файлов конфигурации Vite). `tsconfig.app.json` задаёт правила компиляции TypeScript кода фронтенда.

## tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**`"files": []`**
Корневой файл сам по себе не компилирует никакие файлы. Он только ссылается на другие конфиги через `references`.

**`"references"`**
TypeScript Project References — механизм для разделения большого проекта на части. Каждая часть компилируется отдельно и кэшируется. Это ускоряет пересборку.

## tsconfig.app.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### Построчный разбор

**`"tsBuildInfoFile"`**
Файл кэша инкрементальной сборки. TypeScript запоминает, что уже скомпилировано, чтобы не перекомпилировать всё заново.

**`"target": "es2023"`**
В какой стандарт JavaScript компилировать TypeScript. ES2023 поддерживается всеми современными браузерами.

**`"lib": ["ES2023", "DOM", "DOM.Iterable"]`**
Набор стандартных библиотек TypeScript. `DOM` — типы для браузерного API (`document`, `window`, `fetch`). `DOM.Iterable` — добавляет поддержку итерации по DOM-коллекциям.

**`"module": "esnext"`**
Модульный формат вывода — современные ES-модули с `import`/`export`. Vite умеет работать с ними напрямую.

**`"types": ["vite/client"]`**
Подключает типы Vite для браузерного клиента — например, типы для `import.meta.env` (переменные окружения).

**`"skipLibCheck": true`**
Пропускает проверку типов в файлах `.d.ts` сторонних библиотек. Ускоряет компиляцию и избегает ошибок из-за несовместимых версий типов.

**`"moduleResolution": "bundler"`**
Современный алгоритм разрешения модулей, оптимизированный для работы с бандлерами (Vite, webpack). Правильно обрабатывает `exports` в `package.json`.

**`"allowImportingTsExtensions": true`**
Разрешает импорт с расширением `.ts`/`.tsx`: `import Foo from './Foo.tsx'`. Нужно при `noEmit: true`.

**`"verbatimModuleSyntax": true`**
Импорты типов (`import type { Foo }`) всегда стираются при компиляции. Обычные `import { Foo }` остаются. Это улучшает производительность бандлера.

**`"noEmit": true`**
TypeScript не генерирует JavaScript файлы — только проверяет типы. Реальную компиляцию делает Vite.

**`"jsx": "react-jsx"`**
Как обрабатывать JSX. `react-jsx` — современный режим, не требует `import React from 'react'` в каждом файле.

**`"noUnusedLocals": true`** / **`"noUnusedParameters": true`**
Ошибка при неиспользуемых переменных и параметрах функций. Помогает держать код чистым.

**`"noFallthroughCasesInSwitch": true`**
Ошибка, если в `switch` есть `case` без `break` или `return`. Предотвращает случайное «проваливание» в следующий case.

**`"include": ["src"]`**
Компилировать только файлы из папки `src/`.
