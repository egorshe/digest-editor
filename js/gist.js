export class GistManager {
  constructor() {
    this.filename = "digest-draft.json";
  }

  getConfig() {
    return {
      token:
        document.getElementById("gistToken")?.value ||
        localStorage.getItem("gistToken"),
      id:
        document.getElementById("gistId")?.value ||
        localStorage.getItem("gistId"),
    };
  }

  persistToken(token) {
    localStorage.setItem("gistToken", token);
  }

  persistGistId(gistId) {
    localStorage.setItem("gistId", gistId);
  }

  clearToken() {
    localStorage.removeItem("gistToken");
  }

  async save(data) {
    const config = this.getConfig();

    if (!config.token) {
      throw new Error("Please enter your GitHub Personal Access Token.");
    }

    this.persistToken(config.token);

    const url = config.id
      ? `https://api.github.com/gists/${config.id}`
      : `https://api.github.com/gists`;
    const method = config.id ? "PATCH" : "POST";

    const payload = {
      description: `Digest Generator Draft - ${data.frontmatter?.title || "Untitled"}`,
      public: false,
      files: {
        [this.filename]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          Authorization: `token ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(
          `GitHub API Error (${response.status}): ${errorBody.message || response.statusText}`,
        );
      }

      const json = await response.json();
      this.persistGistId(json.id);
      return json.id;
    } catch (error) {
      console.error("Failed to save to Gist:", error);
      throw new Error(
        `Error saving to Gist: ${error.message}. Check your PAT, Gist ID, and network connection.`,
      );
    }
  }

  async load() {
    const config = this.getConfig();

    if (!config.token) {
      throw new Error("Please enter your GitHub Personal Access Token.");
    }

    if (!config.id) {
      throw new Error("Please enter a Gist ID to load.");
    }

    this.persistToken(config.token);

    const url = `https://api.github.com/gists/${config.id}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `token ${config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(
          `GitHub API Error (${response.status}): ${errorBody.message || response.statusText}`,
        );
      }

      const json = await response.json();
      const fileContent = json.files[this.filename]?.content;

      if (!fileContent) {
        throw new Error(
          `File "${this.filename}" not found in Gist ID: ${config.id}. Make sure the file name is correct.`,
        );
      }

      return JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to load from Gist:", error);
      throw new Error(
        `Error loading from Gist: ${error.message}. Check your Gist ID, PAT, and network connection.`,
      );
    }
  }

  async listUserGists() {
    const config = this.getConfig();

    if (!config.token) {
      throw new Error("Please enter your GitHub Personal Access Token.");
    }

    try {
      const response = await fetch("https://api.github.com/gists", {
        method: "GET",
        headers: {
          Authorization: `token ${config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(
          `GitHub API Error (${response.status}): ${errorBody.message || response.statusText}`,
        );
      }

      const gists = await response.json();
      return gists.filter((g) => g.files[this.filename]);
    } catch (error) {
      console.error("Failed to list gists:", error);
      throw error;
    }
  }
}

export const gistManager = new GistManager();
