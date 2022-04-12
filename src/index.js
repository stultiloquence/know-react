import { toHaveStyle } from '@testing-library/jest-dom/dist/matchers';
import { isLabelWithInternallyDisabledControl } from '@testing-library/user-event/dist/utils';
import React from 'react'
import ReactDOM from 'react-dom'
import ReactMarkdown from 'react-markdown'
import './index.css'

class Folder extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      expanded: false,
      children: []
    }

    this.load = this.load.bind(this);
  }

  async load () {
    if (this.state.expanded) {
      this.setState({
        expanded: false
      });
    } else {
      const handle = this.props.handle;
      const childFolder = [];
      const childFiles = [];
      
      for await (const [_, childHandle] of handle.entries()) {
        let path = (await this.props.rootDir.resolve(childHandle)).join("/");
        if (childHandle.kind === "file") {
          childFiles.push([path, childHandle]);
        } else {
          childFolder.push([path, childHandle]);
        }
      }

      this.setState({
        expanded: true,
        children: childFolder.concat(childFiles)
      });
    }
  }

  render () {
    if (this.props.handle.kind === "file") {
      return (<div
        className={"file" + (this.props.handle === this.props.selectedFile ? " selected" : "")}
        onClick={() => this.props.onSelectFile(this.props.handle)}>
          {this.props.handle.name}
      </div>);
    } else {
      const children = this.state.children.map(([path, handle]) => (
        <Folder
          key={path}
          rootDir={this.props.rootDir}
          selectedFile={this.props.selectedFile}
          handle={handle}
          onSelectFile={this.props.onSelectFile}
        />
      ));
  
      return (
        <div className="folder">
          <div className="folderTitle" onClick={this.load}>
            <div className="expand">{ this.state.expanded ? "▼" : "▶" }</div>
            <div className="name">{this.props.handle.name}</div>
          </div>
          { this.state.expanded ? (this.state.children.length === 0 ? <div className="emptyDirectory">Empty Directory!</div> : children) : "" }
        </div>
      );
    }
  }
}

class FileViewer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      text: ""
    };
  }

  async load () {
    const file = await this.props.file.getFile();
    const text = await file.text();

    this.setState({
      loading: false,
      text: text
    });
  }

  async componentDidMount () {
    await this.load();
  }

  async componentDidUpdate () {
    await this.load();
  }

  render () {
    return (<div className="fileViewer">
      { this.state.loading
        ? <div className="loading">Loading <code>{this.props.file.name}</code>.</div>
        : <ReactMarkdown>{this.state.text}</ReactMarkdown>
      }
    </div>)
  }
}

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      rootDir: null,
      selectedFile: null
    };
    this.load = this.load.bind(this);
    this.selectFile = this.selectFile.bind(this);
  }

  async load () {
    try {
      const dir = await window.showDirectoryPicker();
      this.setState({
        rootDir: dir
      })
    } catch (AbortError) {
      // We don't do anything right now, just offer to load again.  
    }
  }

  selectFile (handle) {
    console.log("Selected file " + handle.name);
    
    this.setState({
      selectedFile: handle
    });
  }

  render () {
    let sideBar;

    if (this.state.rootDir === null) {
      sideBar = <button className="load" onClick={this.load}>Choose a root directory!</button>;
    } else {
      sideBar = (<Folder
        rootDir={this.state.rootDir}
        selectedFile={this.state.selectedFile}
        handle={this.state.rootDir}
        onSelectFile={this.selectFile}
      />);
    }

    return (
      <div className="app">
        <div className="leftPanel">
          { sideBar }
        </div>
        <div className="rightPanel">
          { this.state.selectedFile !== null ? <FileViewer file={this.state.selectedFile} /> : "" }
        </div>
      </div>
    );
  }
}



const theApp = <App />;

ReactDOM.render(
  theApp,
  document.getElementById('root')
);