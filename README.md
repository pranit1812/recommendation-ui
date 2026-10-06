# BidBoard Test Harness

Excel-driven prototype for testing project requirements using GraphRAG integration.

## 🔐 Access

The application is password-protected. Set `APP_PASSWORD` in the environment (see Environment Variables below). The login form sends the password to the server, which compares it with that variable. The password is not stored in the repository.

## 🚀 Features

- **Excel Catalog Management**: Upload and parse Excel files as question catalogs
- **Question Pack Wizard**: Create custom question packs for testing
- **Project Management**: Add/edit/delete project ITB IDs for testing
- **Test Runner**: Execute question packs against GraphRAG endpoints
- **PDF Generation**: Download test results as professional PDF reports
- **Clickable Sources**: PDF sources open to specific pages

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for client-side state
- **Data Storage**: localStorage for persistence (no backend required)
- **PDF Generation**: Puppeteer for server-side PDF creation
- **Excel Processing**: SheetJS for catalog parsing

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📱 Usage

1. **Access**: Enter the password configured in `APP_PASSWORD`
2. **Catalog**: Upload Excel files via Admin → Catalog
3. **Projects**: Manage ITB IDs via Admin → Projects
4. **Create Packs**: Use Question Pack Wizard to create test suites
5. **Run Tests**: Execute packs against projects in Test Runner
6. **Download Reports**: Generate PDF reports with clickable sources

## 🌐 Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables

Set in Vercel dashboard:

```bash
APP_PASSWORD=your-password-here
NEXT_PUBLIC_GRAPH_RAG=https://example.com/query
NEXT_PUBLIC_HWB_API_URL=https://example.com/api
NEXT_PUBLIC_CHAT_SOURCE_BUCKET=your-s3-bucket
```

| Variable | Purpose |
| --- | --- |
| `APP_PASSWORD` | Password checked by `POST /api/auth`. Required for login. |
| `NEXT_PUBLIC_GRAPH_RAG` | GraphRAG query endpoint used by the test runner and chat. |
| `NEXT_PUBLIC_HWB_API_URL` | Base URL for the ITB projects API (proxied by `/api/proxy-itbs`). |
| `NEXT_PUBLIC_CHAT_SOURCE_BUCKET` | S3 bucket name used when building PDF source links. |

Copy `env-example.txt` to `.env.local` and replace the placeholders. `.env` and `.env*.local` are gitignored.

### Deployment Steps

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

## 📋 Technical Specifications

- **Password**: Read from the `APP_PASSWORD` environment variable and verified on the server
- **Sharing**: Anyone with password can add/edit/delete everything
- **Persistence**: All data stored in browser localStorage
- **No Users**: No user authentication system - shared workspace
- **PDF Sources**: Links to S3 bucket with page-specific navigation

## 🔧 Excel File Format

The system expects Excel files with:
- Sheet names representing trades/divisions (e.g., "03-Concrete", "MECHANICAL")
- Column C containing question text
- Questions with "___" placeholders are automatically detected as number-type questions

## 📊 Question Types

- **Number**: Requires threshold comparison (e.g., "How many ___?")
- **Yes/No**: Boolean evaluation with explanations
- **Enum**: Multiple choice or list responses
- **Lookup**: Location or reference-based questions

## 🎯 Scoring System

- Questions have configurable weights (1-10)
- Critical questions cause final verdict failure if not passed
- Base score is weighted percentage (0-100)
- Final verdict: 'Fail (critical)' | 'Bid' | 'Pass'

## 🛠️ Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Administration pages
│   ├── pack/              # Question pack management
│   ├── run/               # Test runner
│   └── api/pdf/           # PDF generation API
├── components/            # Reusable UI components
├── lib/                   # Core utilities and logic
├── store/                 # Zustand state management
├── config/                # Configuration files
└── public/                # Static assets
```

## 🤝 Contributing

This is a prototype system. All users share the same workspace and can modify all data.

## 📄 License

Internal testing tool - not for public distribution. 