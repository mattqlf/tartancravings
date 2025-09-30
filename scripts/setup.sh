#!/bin/bash

echo "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Welcome to Tartan Cravings Setup!"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase credentials"
echo "2. Set up your Supabase database (see SETUP.md)"
echo "3. Configure Google OAuth (see SETUP.md)"
echo "4. Run: npm run dev"
echo ""
echo "📚 See SETUP.md for detailed instructions"