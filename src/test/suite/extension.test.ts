import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import ModelParser from "./../../parser/ModelParser";
import { phpParserTokens } from "../../utils";
import Handler from '../../parser/Handler';

suite("Model Parser Test", () => {
  test("it can get model from inline model", () => {
    const tokens = phpParserTokens(`
            <?php
            App\\User::where('');
        `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(2, 39)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model without namespace inline", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('');
        `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(4, 34)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model when multiple query conditions are before", () => {
    const tokens = phpParserTokens(`
            <?php
            use App\\User;

            $user = User::where('name', $name)->where('');
        `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(4, 56)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from dependency injection", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->where('')
            });
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(5, 31)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from closure", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->when(true, function ($query) {
                    $query->where($example, '')
                        ->where('')
                });
            });
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(7, 34)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from closure that has a static call", () => {
    const tokens = phpParserTokens(`
        <?php
            use App\\User;

            Route::get('/', function (User $user) {
                $user->when(Arr::get($data, 'example'), function ($query) {
                    $query->where($example, '')
                        ->where('')
                });
            });
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(7, 34)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from complex closure", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        $query = Post::query();

        $query = User::query()
            ->when($this->term, function ($query) {
                $query->where('');
            })
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(9, 32)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get model from multiple closure", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        $query = Post::query();

        $query = User::query()
            ->when($this->term, function ($query) {
                $query->where('name', 'John');
            })
            ->when($this->term, function ($query) {
                $query->where('');
            })
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(12, 32)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\User", className);
  });

  test("it can get multiple models", () => {
    const tokens = phpParserTokens(`
        <?php
        use App\\User;
        use App\\Post;

        Route::get('/', function (User $user, Post $post) {
            $user->where('name', 'name')->where('email', 'email')->get();

            $post->where('')
        });
    `);

    const aliasToken = Handler.getEloquentAliasToken(
      tokens,
      ["where"],
      new vscode.Position(8, 27)
    );

    const modelParser = new ModelParser(tokens, aliasToken);

    const className = modelParser.getFullClassName();

    assert.equal("App\\Post", className);
  });
});
