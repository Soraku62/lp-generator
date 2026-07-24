const projects = [];
let nextProjectId = 1;

/**
 * 新しいプロジェクトを保存する
 */
function createProject(projectData) {
  const project = {
    ...projectData,
    id: nextProjectId,
    createdAt: projectData.createdAt || new Date().toISOString()
  };

  projects.push(project);
  nextProjectId += 1;

  return project;
}

/**
 * すべてのプロジェクトを取得する
 */
function getAllProjects() {
  return projects;
}

/**
 * IDからプロジェクトを1件取得する
 */
function findProjectById(id) {
  const numericId = Number(id);

  return projects.find((project) => project.id === numericId);
}

module.exports = {
  createProject,
  getAllProjects,
  findProjectById
};