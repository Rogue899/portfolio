import './ProjectFolder.css';

const ProjectFolder = ({ project }) => {
  return (
    <div className="project-folder">
      <div className="folder-header">
        <h2>{project.title}</h2>
      </div>
      <div className="folder-content">
        {project.url && (
          <div className="project-preview">
            <h3>Project Preview</h3>
            <div className="iframe-container">
              <iframe
                src={project.url}
                title={project.title}
                className="project-iframe"
                frameBorder="0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectFolder;

