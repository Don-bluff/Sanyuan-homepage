# Don't bluff me - Personal Brand

A modern personal brand website built with Next.js and Supabase, featuring authentic perspectives and genuine insights with a sleek black & white design.

## 🚀 技术栈

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## ✨ Features

- 🎨 Minimalist black & white design with smooth animations
- 📱 Fully responsive design for all devices
- 🔐 Integrated Supabase authentication system
- 💾 Database support for user profiles and content management
- ⚡ Optimized performance and SEO
- 🖤 Elegant dark theme with monochromatic aesthetics

## 🛠️ Local Development

### 1. Clone the repository

\`\`\`bash
git clone <your-repo-url>
cd sanyuan-homepage
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables

Create a \`.env.local\` file and configure Supabase:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
\`\`\`

### 4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🗄️ 数据库设置

### Supabase 表结构

#### profiles 表
\`\`\`sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  avatar_url text,
  bio text
);

-- 启用 RLS
alter table profiles enable row level security;

-- RLS 策略
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );
\`\`\`

#### posts 表
\`\`\`sql
create table posts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  author_id uuid references auth.users(id) on delete cascade not null,
  published boolean default false
);

-- 启用 RLS
alter table posts enable row level security;

-- RLS 策略
create policy "Published posts are viewable by everyone."
  on posts for select
  using ( published = true );

create policy "Users can view their own posts."
  on posts for select
  using ( auth.uid() = author_id );

create policy "Users can insert their own posts."
  on posts for insert
  with check ( auth.uid() = author_id );

create policy "Users can update their own posts."
  on posts for update
  using ( auth.uid() = author_id );
\`\`\`

## 📁 项目结构

\`\`\`
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── providers/         # Context providers
│   └── ui/               # UI 组件库
├── lib/                  # 工具库
│   ├── supabase.ts       # Supabase 客户端配置
│   ├── supabase-browser.ts
│   └── utils.ts          # 通用工具函数
└── types/                # TypeScript 类型定义
    └── database.ts       # 数据库类型
\`\`\`

## 🚀 部署

### 使用 Vercel 部署

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量
4. 部署完成！

### 环境变量设置

在 Vercel Dashboard 中设置以下环境变量：

- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Don't bluff me** - Authentic perspectives, genuine insights. No bluffing, just real talk. 🖤