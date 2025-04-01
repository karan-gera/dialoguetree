# Dialogue Tree Editor

A visual editor for creating and managing dialogue trees in games or interactive stories. Built with React and ReactFlow, this tool allows you to create, edit, and visualize branching dialogue structures with an intuitive drag-and-drop interface.

## Features

- 🎯 Visual node-based dialogue tree editor
- 🔄 Drag-and-drop interface for easy node positioning
- 📝 Edit dialogue text and speaker information
- 🔗 Create and manage dialogue branches
- 💾 Automatic saving of node positions and dialogue structure
- 🎨 Clean, modern UI with a responsive design
- 🔍 Mini-map for easy navigation of large dialogue trees
- 🖱️ Context menus for quick editing and deletion

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dialoguetree.git
cd dialoguetree
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the React frontend and the Express backend server concurrently.

## Usage

### Basic Operations

1. **Creating Nodes**
   - Click on a node to select it
   - Click "Add Connected Node" to create a new dialogue node
   - Fill in the speaker and dialogue text
   - Enter the choice text that leads to this node

2. **Editing Nodes**
   - Click on any node to open the edit panel
   - Modify the speaker and dialogue text
   - Save changes or delete the node

3. **Managing Connections**
   - Click on any connection to edit the choice text
   - Drag from one node's handle to another to create new connections
   - Delete connections using the context menu

4. **Navigation**
   - Use the minimap in the bottom-right corner for quick navigation
   - Pan the canvas by dragging the background
   - Zoom in/out using the mouse wheel or controls

### File Structure

Dialogue trees are saved as JSON files in the following format:

```json
{
  "start": {
    "speaker": "Character Name",
    "text": "Dialogue text here",
    "choices": [
      {
        "speaker": "Player",
        "text": "Player response",
        "next": "next_node_id"
      }
    ],
    "position": {
      "x": 0,
      "y": 0
    }
  }
}
```

## Development

### Project Structure

```
dialoguetree/
├── public/
│   └── alessandro1.json    # Example dialogue file
├── src/
│   ├── App.js             # Main application component
│   ├── App.css            # Application styles
│   └── index.js           # Application entry point
├── server.js              # Express backend server
└── package.json           # Project dependencies and scripts
```

### Available Scripts

- `npm start` - Start the React development server
- `npm run server` - Start the Express backend server
- `npm run dev` - Start both servers concurrently
- `npm run build` - Build the production version
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ReactFlow](https://reactflow.dev/) for the node-based visualization
- [React](https://reactjs.org/) for the UI framework
- [Express](https://expressjs.com/) for the backend server
